function createLib (execlib) {

  var lib = execlib.lib;

  function nr2personal (nrs, userid) {
    var i, nr;
    if (!lib.isArray(nrs)) {
      return null;
    }
    for (i=0; i<nrs.length; i++) {
      nr = nrs[i];
      if (nr.u === userid) {
        return nr.nr;
      }
    }
    return null;
  }

  function newgroup2personal (ntfobj, userid) {
    console.log('newgroup2personal?', ntfobj);
    return ntfobj;
  }

  function newgroupmember2personal (ntfobj, userid) {
    console.log('newgroupmember2personal?', ntfobj);
    return ntfobj;
  }

  function rcvdseen2personal (ntfobj, isgroup, userid, rcvdorseen, wantnewobject) {
    var ret, propname = rcvdorseen+'by', prop;
    if (!ntfobj) {
      return null;
    }
    if (!(propname in ntfobj)) {
      return null;
    }
    if (ntfobj[propname] === userid) {
      return null;
    }
    ret = wantnewobject ? lib.extend({}, ntfobj) : ntfobj;
    prop = ret[propname];
    if (lib.isArray(prop)) {
      if (wantnewobject) {
        ret[propname] = prop.map(selfsubstituterformap.bind(null, userid));
      } else {
        prop.forEach(selfsubstituterforeach.bind(null, userid));
      }
    } else {
      selfsubstituter(ret, propname, userid, isgroup);
    }
    //console.log('=>', ntfobj);
    userid = null;
    wantnewobject = null;
    return ret;
  }

  function selfsubstituterforeach (userid, item) {
    selfsubstituter(item, 'u', userid, true);
  }
  function selfsubstituterformap (userid, item) {
    var myitem = lib.extend({}, item);
    selfsubstituter(myitem, 'u', userid, true);
    return myitem;
  }

  function edited2personal (ntfobj, userid) {
    var myntfobj = lib.pickExcept(ntfobj, ['messageid', 'edited', 'moment', 'p2p', 'affected']);
    myntfobj.editedmessage = {
      id: ntfobj.messageid,
      message: ntfobj.edited,
      moment: ntfobj.moment
    };
    return myntfobj;
  }

  function preview2personal (ntfobj, userid) {
    var myntfobj = lib.pickExcept(ntfobj, ['messageid', 'preview', 'p2p', 'affected']);
    myntfobj.preview = lib.extend({}, ntfobj.preview, {id: ntfobj.messageid});
    return myntfobj;
  }

  function activity2personal (ntfobj, userid) {
    var myntfobj;
    if (ntfobj.activity === userid) {
      return null;
    }
    myntfobj = lib.pickExcept(ntfobj, ['affected']);
    myntfobj.activity = ntfobj.activity;
    return myntfobj;
  }

  function notification2personal (ntfobj, userid) {
    var mymessage, myntfobj, mynr;
    if (!ntfobj) {
      return null;
    }
    if (ntfobj.newgroup) {
      return newgroup2personal(ntfobj, userid, 'rcvd');
    }
    if (ntfobj.newgroupmember) {
      return newgroupmember2personal(ntfobj, userid, 'rcvd');
    }
    if (ntfobj.rcvdby) {
      return rcvdseen2personal(ntfobj, !ntfobj.p2p, userid, 'rcvd', true);
    }
    if (ntfobj.seenby) {
      return rcvdseen2personal(ntfobj, !ntfobj.p2p, userid, 'seen', true);
    }
    if (ntfobj.edited) {
      return edited2personal(ntfobj, userid);
    }
    if ('preview' in ntfobj) {
      return preview2personal(ntfobj, userid);
    }
    if ('activity' in ntfobj) {
      return activity2personal(ntfobj, userid);
    }
    //console.log('personalize chat ntf', ntfobj, 'with', userid);
    mymessage = msguserandmidder(
      !ntfobj.p2p,
      userid,
      ntfobj.mids[1],
      lib.extend({}, ntfobj.lastmessage)
    );
    myntfobj = lib.pickExcept(ntfobj, ['lastmessage', 'affected']);
    //console.log('notification2personal', userid, ntfobj.lastmessage);
    if (!ntfobj.p2p) {
      mymessage = rcvdseen2personal(mymessage, !ntfobj.p2p, userid, 'rcvd', true);
      mymessage = rcvdseen2personal(mymessage, !ntfobj.p2p, userid, 'seen', true);
    }
    //console.log('=>', mymessage);
    myntfobj.lastmessage = mymessage;
    mynr = nr2personal(ntfobj.nr, userid);
    //console.log('i, sta je mynr? od', ntfobj, 'za', userid, '=>', mynr);
    if (lib.isVal(mynr)) {
      myntfobj.nr = mynr;
    }
    return myntfobj;
  }

  function selfsubstituter (obj, propname, myuserid, isgroup) {
    if (obj[propname] === myuserid) {
      obj[propname] = null;
    } else if (!isgroup) {
      obj[propname] = '';
    }
  }

  function msguserandmidder (isgroup, myuserid, mid, msg) {
    selfsubstituter(msg, 'from', myuserid, isgroup);
    msg.id = mid;
    return msg;
  }

  function shouldNotificationBeMarkedAsRcvd (username, ntfobj) {
    var ret, item;
    if (!(ntfobj && ntfobj.lastmessage && ntfobj.mids)) {
      return;
    }
    if (ntfobj.p2p) {
      return (ntfobj.lastmessage.rcvd===null && ntfobj.lastmessage.from!==username)
      ?
      {
        userid: username,
        conversationid: ntfobj.id,
        messageid: ntfobj.mids[ntfobj.mids.length-1]
      }
      :
      null;
    }
    if (lib.isArray(ntfobj.lastmessage.rcvdby)) {
      //console.log('shouldNotificationBeMarkedAsRcvd?', username, require('util').inspect(ntfobj, {depth:8}));
      for (i=0; i<ntfobj.lastmessage.rcvdby.length; i++) {
        item = ntfobj.lastmessage.rcvdby[i];
        if (item.u === username) {
          return item.rcvd ?
            null
            :
            {
              userid: username,
              conversationid: ntfobj.id,
              messageid: ntfobj.mids[ntfobj.mids.length-1]
            };
        }
      }
    }
    return null;
  }

  return {
    rcvdseen2personal: rcvdseen2personal,
    nr2personal: nr2personal,
    notification2personal: notification2personal,
    msguserandmidder: msguserandmidder,
    selfsubstituter: selfsubstituter,
    shouldNotificationBeMarkedAsRcvd: shouldNotificationBeMarkedAsRcvd
  };
}
module.exports = createLib;
